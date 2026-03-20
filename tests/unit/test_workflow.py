import pytest
from django.core.exceptions import ValidationError

from api.models import JobCard, WorkflowStage, WORKFLOW_TRANSITIONS
from tests.conftest import JobCardFactory, UserFactory


@pytest.mark.unit
@pytest.mark.django_db
class TestJobCardWorkflowTransitions:
    def test_valid_transition_appointment_to_checkin(self):
        jc = JobCardFactory(workflow_stage=WorkflowStage.APPOINTMENT)
        assert jc.can_transition_to(WorkflowStage.CHECK_IN) is True

    def test_invalid_transition_appointment_to_execution(self):
        jc = JobCardFactory(workflow_stage=WorkflowStage.APPOINTMENT)
        assert jc.can_transition_to(WorkflowStage.EXECUTION) is False

    def test_transition_to_performs_change(self):
        jc = JobCardFactory(workflow_stage=WorkflowStage.APPOINTMENT)
        actor = UserFactory()
        jc.transition_to(WorkflowStage.CHECK_IN, actor=actor)
        jc.refresh_from_db()
        assert jc.workflow_stage == WorkflowStage.CHECK_IN

    def test_invalid_transition_raises_error(self):
        jc = JobCardFactory(workflow_stage=WorkflowStage.APPOINTMENT)
        actor = UserFactory()
        with pytest.raises(ValidationError):
            jc.transition_to(WorkflowStage.COMPLETED, actor=actor)

    def test_full_workflow_happy_path(self):
        jc = JobCardFactory(workflow_stage=WorkflowStage.APPOINTMENT)
        actor = UserFactory()
        stages = [
            WorkflowStage.CHECK_IN,
            WorkflowStage.INSPECTION,
            WorkflowStage.JOB_CARD,
            WorkflowStage.ESTIMATE,
            WorkflowStage.APPROVAL,
            WorkflowStage.EXECUTION,
            WorkflowStage.QC,
            WorkflowStage.BILLING,
            WorkflowStage.DELIVERY,
            WorkflowStage.COMPLETED,
        ]
        for stage in stages:
            jc.transition_to(stage, actor=actor)
            jc.refresh_from_db()
            assert jc.workflow_stage == stage

    def test_completed_cannot_transition(self):
        jc = JobCardFactory(workflow_stage=WorkflowStage.APPOINTMENT)
        actor = UserFactory()
        for stage in [WorkflowStage.CHECK_IN, WorkflowStage.INSPECTION,
                      WorkflowStage.JOB_CARD, WorkflowStage.ESTIMATE,
                      WorkflowStage.APPROVAL, WorkflowStage.EXECUTION,
                      WorkflowStage.QC, WorkflowStage.BILLING,
                      WorkflowStage.DELIVERY, WorkflowStage.COMPLETED]:
            jc.transition_to(stage, actor=actor)
        with pytest.raises(ValidationError):
            jc.transition_to(WorkflowStage.APPOINTMENT, actor=actor)

    def test_qc_can_loop_back_to_execution(self):
        jc = JobCardFactory(workflow_stage=WorkflowStage.APPOINTMENT)
        actor = UserFactory()
        for stage in [WorkflowStage.CHECK_IN, WorkflowStage.INSPECTION,
                      WorkflowStage.JOB_CARD, WorkflowStage.ESTIMATE,
                      WorkflowStage.APPROVAL, WorkflowStage.EXECUTION,
                      WorkflowStage.QC]:
            jc.transition_to(stage, actor=actor)
        jc.transition_to(WorkflowStage.EXECUTION, actor=actor)
        jc.refresh_from_db()
        assert jc.workflow_stage == WorkflowStage.EXECUTION

    def test_approval_can_loop_back_to_estimate(self):
        jc = JobCardFactory(workflow_stage=WorkflowStage.APPOINTMENT)
        actor = UserFactory()
        for stage in [WorkflowStage.CHECK_IN, WorkflowStage.INSPECTION,
                      WorkflowStage.JOB_CARD, WorkflowStage.ESTIMATE,
                      WorkflowStage.APPROVAL]:
            jc.transition_to(stage, actor=actor)
        jc.transition_to(WorkflowStage.ESTIMATE, actor=actor)
        jc.refresh_from_db()
        assert jc.workflow_stage == WorkflowStage.ESTIMATE

    def test_transition_creates_service_event(self):
        from api.models import ServiceEvent
        jc = JobCardFactory(workflow_stage=WorkflowStage.APPOINTMENT)
        actor = UserFactory()
        initial_count = ServiceEvent.objects.filter(job_card=jc).count()
        jc.transition_to(WorkflowStage.CHECK_IN, actor=actor)
        assert ServiceEvent.objects.filter(job_card=jc).count() == initial_count + 1
